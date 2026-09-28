using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }

        [Required, ForeignKey("Issue")]
        public int IssueId { get; set; }
        [JsonIgnore] 
        public virtual Issue Issue { get; set; }

        [Required, ForeignKey("User")]
        public int UserId { get; set; }
        [JsonIgnore] 
        public virtual User User { get; set; }

        [Required, MaxLength(500)]
        public string Message { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
