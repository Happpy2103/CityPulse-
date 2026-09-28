using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CityPulse.API.Data;
using CityPulse.API.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IssueHistoriesController : ControllerBase
    {
        private readonly CityPulseDbContext _context;

        public IssueHistoriesController(CityPulseDbContext context)
        {
            _context = context;
        }

        // GET: api/IssueHistories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IssueHistory>>> GetIssueHistories()
        {
            // If you don't want navigation props at all, we've already JsonIgnored them in model
            return await _context.IssueHistories
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();
        }

        // GET: api/IssueHistories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<IssueHistory>> GetIssueHistory(int id)
        {
            var issueHistory = await _context.IssueHistories.FindAsync(id);

            if (issueHistory == null)
            {
                return NotFound();
            }

            return issueHistory;
        }

        // PUT: api/IssueHistories/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutIssueHistory(int id, IssueHistory issueHistory)
        {
            if (id != issueHistory.HistoryId)
            {
                return BadRequest();
            }

            // we don't want client to control ChangedAt on update
            issueHistory.ChangedAt = DateTime.UtcNow;

            _context.Entry(issueHistory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IssueHistoryExists(id))
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

        // POST: api/IssueHistories
        // Called when admin assigns officer from UI
        [HttpPost]
        public async Task<ActionResult<IssueHistory>> PostIssueHistory([FromBody] IssueHistory issueHistory)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            // Basic checks: issue & admin should exist
            var issue = await _context.Issues.FindAsync(issueHistory.IssueId);
            if (issue == null)
            {
                return BadRequest(new { message = "Invalid IssueId" });
            }

            var adminUser = await _context.Users.FindAsync(issueHistory.ChangedBy);
            if (adminUser == null)
            {
                return BadRequest(new { message = "Invalid ChangedBy user" });
            }

            // Force ChangedAt from server
            issueHistory.ChangedAt = DateTime.UtcNow;

            // (Optional but recommended) update issue current status to NewStatus
            if (issueHistory.NewStatus != 0)
            {
                issue.StatusId = issueHistory.NewStatus;
                issue.UpdatedAt = DateTime.UtcNow;
            }

            _context.IssueHistories.Add(issueHistory);
            await _context.SaveChangesAsync();

            // return created entity (frontend uses it to update timeline)
            return CreatedAtAction(
                nameof(GetIssueHistory),
                new { id = issueHistory.HistoryId },
                issueHistory
            );
        }

        // DELETE: api/IssueHistories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIssueHistory(int id)
        {
            var issueHistory = await _context.IssueHistories.FindAsync(id);
            if (issueHistory == null)
            {
                return NotFound();
            }

            _context.IssueHistories.Remove(issueHistory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IssueHistoryExists(int id)
        {
            return _context.IssueHistories.Any(e => e.HistoryId == id);
        }
    }
}
