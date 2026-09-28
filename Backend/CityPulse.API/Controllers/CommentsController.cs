using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CityPulse.API.Data;
using CityPulse.API.Model;

namespace CityPulse.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly CityPulseDbContext _context;

        public CommentsController(CityPulseDbContext context)
        {
            _context = context;
        }

        // GET: api/Comments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments()
        {
            return await _context.Comments.ToListAsync();
        }

        // GET: api/Comments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Comment>> GetComment(int id)
        {
            var comment = await _context.Comments.FindAsync(id);

            if (comment == null)
            {
                return NotFound();
            }

            return comment;
        }

        // PUT: api/Comments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutComment(int id, Comment comment)
        {
            if (id != comment.CommentId)
            {
                return BadRequest();
            }

            _context.Entry(comment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CommentExists(id))
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

        // POST: api/Comments
        // 🔥 CHANGED: manually read JSON instead of binding Comment
        [HttpPost]
        public async Task<ActionResult<Comment>> PostComment([FromBody] JsonElement body)
        {
            // Expect: { "issueId": 1, "userId": 2, "commentText": "..." }

            if (!body.TryGetProperty("issueId", out var issueProp) ||
                !body.TryGetProperty("userId", out var userProp) ||
                !body.TryGetProperty("commentText", out var textProp))
            {
                return BadRequest("issueId, userId and commentText are required.");
            }

            int issueId;
            int userId;
            string? commentText = textProp.GetString();

            try
            {
                issueId = issueProp.GetInt32();
                userId = userProp.GetInt32();
            }
            catch
            {
                return BadRequest("issueId and userId must be integers.");
            }

            if (string.IsNullOrWhiteSpace(commentText))
            {
                return BadRequest("commentText is required.");
            }

            var comment = new Comment
            {
                IssueId = issueId,
                UserId = userId,
                CommentText = commentText.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComment), new { id = comment.CommentId }, comment);
        }

        // DELETE: api/Comments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CommentExists(int id)
        {
            return _context.Comments.Any(e => e.CommentId == id);
        }
    }
}
