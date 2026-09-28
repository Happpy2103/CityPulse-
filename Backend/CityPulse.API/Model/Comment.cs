using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Comment
    {
        [Key]
        public int CommentId { get; set; }

        [Required, ForeignKey("Issue")]
        public int IssueId { get; set; }
        
        [JsonIgnore] 
        public virtual Issue Issue { get; set; }

        [Required, ForeignKey("User")]
        public int UserId { get; set; }
        
        [JsonIgnore]
        public virtual User User { get; set; }

        [Required, MaxLength(1000)]
        public string CommentText { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
