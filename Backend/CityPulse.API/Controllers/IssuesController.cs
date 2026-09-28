using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CityPulse.API.Data;
using CityPulse.API.Model;

namespace CityPulse.API.Controllers
{
    // Generic API response wrapper
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class IssuesController : ControllerBase
    {
        private readonly CityPulseDbContext _context;

        public IssuesController(CityPulseDbContext context)
        {
            _context = context;
        }

        // GET: api/Issues
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<Issue>>>> GetIssues()
        {
            var issues = await _context.Issues.ToListAsync();

            return Ok(new ApiResponse<IEnumerable<Issue>>
            {
                Success = true,
                Message = "Issues fetched successfully.",
                Data = issues
            });
        }

        // GET: api/Issues/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<Issue>>> GetIssue(int id)
        {
            var issue = await _context.Issues.FindAsync(id);

            if (issue == null)
            {
                return NotFound(new ApiResponse<Issue>
                {
                    Success = false,
                    Message = "Issue not found.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<Issue>
            {
                Success = true,
                Message = "Issue fetched successfully.",
                Data = issue
            });
        }

        // PUT: api/Issues/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<Issue>>> PutIssue(int id, Issue issue)
        {
            if (id != issue.IssueId)
            {
                return BadRequest(new ApiResponse<Issue>
                {
                    Success = false,
                    Message = "Route ID and body ID do not match.",
                    Data = null
                });
            }

            _context.Entry(issue).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<Issue>
                {
                    Success = true,
                    Message = "Issue updated successfully.",
                    Data = issue
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IssueExists(id))
                {
                    return NotFound(new ApiResponse<Issue>
                    {
                        Success = false,
                        Message = "Issue not found.",
                        Data = null
                    });
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new ApiResponse<Issue>
                        {
                            Success = false,
                            Message = "A concurrency error occurred while updating the issue.",
                            Data = null
                        });
                }
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<Issue>
                    {
                        Success = false,
                        Message = "An error occurred while updating the issue.",
                        Data = null
                    });
            }
        }

        // POST: api/Issues
        [HttpPost]
        public async Task<ActionResult<ApiResponse<Issue>>> PostIssue(Issue issue)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<Issue>
                {
                    Success = false,
                    Message = "Invalid issue data.",
                    Data = null
                });
            }

            try
            {
                _context.Issues.Add(issue);
                await _context.SaveChangesAsync();

                var response = new ApiResponse<Issue>
                {
                    Success = true,
                    Message = "Issue created successfully.",
                    Data = issue
                };

                // 201 Created with location header pointing to GetIssue
                return CreatedAtAction(
                    nameof(GetIssue),
                    new { id = issue.IssueId },
                    response
                );
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<Issue>
                    {
                        Success = false,
                        Message = "An error occurred while creating the issue.",
                        Data = null
                    });
            }
        }

        // DELETE: api/Issues/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteIssue(int id)
        {
            var issue = await _context.Issues.FindAsync(id);
            if (issue == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Issue not found.",
                    Data = null
                });
            }

            try
            {
                _context.Issues.Remove(issue);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Issue deleted successfully.",
                    Data = new { id }
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>
                    {
                        Success = false,
                        Message = "An error occurred while deleting the issue.",
                        Data = null
                    });
            }
        }

        private bool IssueExists(int id)
        {
            return _context.Issues.Any(e => e.IssueId == id);
        }
    }
}
