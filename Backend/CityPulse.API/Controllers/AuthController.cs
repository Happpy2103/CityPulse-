using CityPulse.API.Data;
using CityPulse.API.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CityPulseDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(CityPulseDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // REGISTER
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] User user)
    {
        if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            return BadRequest("Email already registered.");

        // Hash the password
        user.PasswordHash = ComputeSha256Hash(user.PasswordHash);

        // Hardcode role
        user.RoleId = 2;
        user.CreatedAt = DateTime.UtcNow;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.UserId,
            user.Name,
            user.Email,
            user.RoleId,
            user.CreatedAt
        });
    }

    // LOGIN
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (dbUser == null) return Unauthorized("Invalid email or password.");

        if (dbUser.PasswordHash != ComputeSha256Hash(request.Password))
            return Unauthorized("Invalid email or password.");

        var token = GenerateJwtToken(dbUser);

        return Ok(new
        {
            token,
            user = new
            {
                dbUser.UserId,
                dbUser.Name,
                dbUser.Email,
                dbUser.RoleId
            }
        });
    }



    // JWT GENERATOR
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("UserId", user.UserId.ToString()),
            new Claim("RoleId", user.RoleId.ToString()),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // SHA256 Password Hash
    private string ComputeSha256Hash(string rawData)
    {
        using (var sha256 = SHA256.Create())
        {
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
            return Convert.ToBase64String(bytes);
        }
    }
}
