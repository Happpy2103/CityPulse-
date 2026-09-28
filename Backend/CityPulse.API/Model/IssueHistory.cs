using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace CityPulse.API.Model
{
    public class IssueHistory
    {
        [Key]
        public int HistoryId { get; set; }

        [Required, ForeignKey("Issue")]
        public int IssueId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public virtual Issue? Issue { get; set; }   // ✅ nullable

        [Required, ForeignKey("ChangedByUser")]
        public int ChangedBy { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public virtual User? ChangedByUser { get; set; }  // ✅ nullable

        public int OldStatus { get; set; }
        public int NewStatus { get; set; }

        public int? OldAssignee { get; set; }
        public int? NewAssignee { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
