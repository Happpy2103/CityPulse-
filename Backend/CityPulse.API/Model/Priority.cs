using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class Priority
    {
        [Key]
        public int PriorityId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        public int Level { get; set; }

        [JsonIgnore] 
        public virtual ICollection<Issue> Issues { get; set; } = new List<Issue>();
    }
}
