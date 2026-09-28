using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CityPulse.API.Data;
using CityPulse.API.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IssueMediasController : ControllerBase
    {
        private readonly CityPulseDbContext _context;
        private readonly IWebHostEnvironment _env;

        public IssueMediasController(CityPulseDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/IssueMedias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IssueMedia>>> GetIssueMedias()
        {
            return await _context.IssueMedias.ToListAsync();
        }

        // GET: api/IssueMedias/5
        [HttpGet("{id}")]
        public async Task<ActionResult<IssueMedia>> GetIssueMedia(int id)
        {
            var issueMedia = await _context.IssueMedias.FindAsync(id);

            if (issueMedia == null)
            {
                return NotFound();
            }

            return issueMedia;
        }

        // PUT: api/IssueMedias/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutIssueMedia(int id, IssueMedia issueMedia)
        {
            if (id != issueMedia.MediaId)
            {
                return BadRequest();
            }

            _context.Entry(issueMedia).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IssueMediaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }


        // POST: api/IssueMedias
        // Upload file + create IssueMedia row
        // Accepts multipart/form-data with:
        //   issueId: number
        //   file:   binary file
        [HttpPost]
        [RequestSizeLimit(20_000_000)] // 20 MB, adjust as needed
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<IssueMedia>> PostIssueMedia(
            [FromForm] int issueId,   // 👈 force binding from form field "issueId"
            IFormFile file)           // 👈 file part "file"
        {
            // 1) Validation
            if (issueId <= 0)
                return BadRequest("IssueId is required.");

            if (file == null || file.Length == 0)
                return BadRequest("File is required.");

            // 2) Ensure the issue exists
            var issueExists = await _context.Issues.AnyAsync(i => i.IssueId == issueId);
            if (!issueExists)
                return NotFound($"Issue with id {issueId} not found.");

            // 3) Prepare upload folder: wwwroot/issue-media
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadFolder = Path.Combine(webRoot, "issue-media");

            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            // 4) Generate unique file name and save
            var extension = Path.GetExtension(file.FileName);
            var uniqueName = $"{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(uploadFolder, uniqueName);

            using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            // 5) Relative path for frontend
            var relativePath = $"/issue-media/{uniqueName}";

            // 6) Create IssueMedia entity using YOUR model
            var media = new IssueMedia
            {
                IssueId = issueId,
                FileName = file.FileName,   // original name
                FilePath = relativePath     // short URL/path
            };

            _context.IssueMedias.Add(media);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIssueMedia), new { id = media.MediaId }, media);
        }


        // DELETE: api/IssueMedias/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIssueMedia(int id)
        {
            var issueMedia = await _context.IssueMedias.FindAsync(id);
            if (issueMedia == null)
            {
                return NotFound();
            }

            _context.IssueMedias.Remove(issueMedia);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IssueMediaExists(int id)
        {
            return _context.IssueMedias.Any(e => e.MediaId == id);
        }
    }
}
