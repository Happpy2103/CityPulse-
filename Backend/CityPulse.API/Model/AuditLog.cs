using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CityPulse.API.Model
{
    public class AuditLog
    {
        [Key]
        public int LogId { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }
        public virtual User User { get; set; }

        [Required, MaxLength(200)]
        public string Action { get; set; }

        [Required, MaxLength(100)]
        public string TableName { get; set; }

        public string RecordId { get; set; }

        public string OldValue { get; set; }
        public string NewValue { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
