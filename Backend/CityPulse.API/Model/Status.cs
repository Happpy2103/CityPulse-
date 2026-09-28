using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Status
    {
        [Key]
        public int StatusId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        [JsonIgnore] 
        public virtual ICollection<Issue> Issues { get; set; } = new List<Issue>();
    }
}
