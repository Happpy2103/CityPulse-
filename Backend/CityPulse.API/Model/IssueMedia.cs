using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CityPulse.API.Model
{
    public class IssueMedia
    {
        [Key]
        public int MediaId { get; set; }

        [Required, ForeignKey("Issue")]
        public int IssueId { get; set; }

        [Required, MaxLength(2000)]
        public string FileName { get; set; }

        [Required, MaxLength(200)]
        public string FilePath { get; set; }

        [JsonIgnore]
        public virtual Issue? Issue { get; set; }
    }
}
