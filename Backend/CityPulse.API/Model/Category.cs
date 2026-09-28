using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        [JsonIgnore]
        public virtual ICollection<Issue> Issues { get; set; } = new List<Issue>();
    }
}
