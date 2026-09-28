using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [Required, MaxLength(150)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }
         
        [MaxLength(10)]
        public string Phone { get; set; }

        // Hardcode role for registration
        [Required]
        public int RoleId { get; set; } = 2;

        // Remove ForeignKey attribute entirely
        [JsonIgnore]
        public virtual Role? Role { get; set; } // Optional navigation property

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [JsonIgnore]
        public DateTime? UpdatedAt { get; set; }

        [JsonIgnore]
        public virtual ICollection<Issue> ReportedIssues { get; set; } = new List<Issue>();
        [JsonIgnore]
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        [JsonIgnore]
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        [JsonIgnore]
        public virtual ICollection<IssueHistory> ChangedIssues { get; set; } = new List<IssueHistory>();
        [JsonIgnore]
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
}
