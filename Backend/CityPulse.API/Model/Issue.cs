using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Issue
    {
        [Key]
        public int IssueId { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; }

        // Foreign Keys
        [Required, ForeignKey("Category")]
        public int CategoryId { get; set; }

        [Required, ForeignKey("ReportedByUser")]
        public int ReportedBy { get; set; }

        [Required, ForeignKey("Status")]
        public int StatusId { get; set; }

        [Required, ForeignKey("Priority")]
        public int PriorityId { get; set; }

        [Column(TypeName = "decimal(10,8)")]
        public decimal Latitude { get; set; }

        [Column(TypeName = "decimal(11,8)")]
        public decimal Longitude { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }

        // Navigation properties (nullable to avoid validation errors)
        [JsonIgnore]
        public virtual Category? Category { get; set; }

        [JsonIgnore]
        public virtual User? ReportedByUser { get; set; }

        [JsonIgnore]
        public virtual Status? Status { get; set; }

        [JsonIgnore]
        public virtual Priority? Priority { get; set; }

        // Media
        [JsonIgnore]
        public virtual ICollection<IssueMedia> IssueMedia { get; set; } = new List<IssueMedia>();

        // Other relationships
        [JsonIgnore]
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

        [JsonIgnore]
        public virtual ICollection<IssueHistory> IssueHistories { get; set; } = new List<IssueHistory>();

        [JsonIgnore]
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
