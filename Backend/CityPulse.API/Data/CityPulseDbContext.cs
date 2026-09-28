using CityPulse.API.Model;
using Microsoft.EntityFrameworkCore;

namespace CityPulse.API.Data
{
    public class CityPulseDbContext : DbContext
    {
        public CityPulseDbContext(DbContextOptions<CityPulseDbContext> options)
            : base(options)
        {
        }

        // DbSets for all models
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Issue> Issues { get; set; }
        public DbSet<IssueHistory> IssueHistories { get; set; }
        public DbSet<IssueMedia> IssueMedias { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Priority> Priorities { get; set; }
        public DbSet<Status> Statuses { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User → Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Issue → Category relationship
            modelBuilder.Entity<Issue>()
                .HasOne(i => i.Category)
                .WithMany(c => c.Issues)
                .HasForeignKey(i => i.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Issue → Status relationship
            modelBuilder.Entity<Issue>()
                .HasOne(i => i.Status)
                .WithMany(s => s.Issues)
                .HasForeignKey(i => i.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // Issue → Priority relationship
            modelBuilder.Entity<Issue>()
                .HasOne(i => i.Priority)
                .WithMany(p => p.Issues)
                .HasForeignKey(i => i.PriorityId)
                .OnDelete(DeleteBehavior.Restrict);

            // Issue → ReportedByUser relationship
            modelBuilder.Entity<Issue>()
                .HasOne(i => i.ReportedByUser)
                .WithMany(u => u.ReportedIssues)
                .HasForeignKey(i => i.ReportedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Comment → Issue & User
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Issue)
                .WithMany(i => i.Comments)
                .HasForeignKey(c => c.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification → Issue & User
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Issue)
                .WithMany(i => i.Notifications)
                .HasForeignKey(n => n.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // IssueHistory → Issue & ChangedByUser
            modelBuilder.Entity<IssueHistory>()
                .HasOne(h => h.Issue)
                .WithMany(i => i.IssueHistories)
                .HasForeignKey(h => h.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<IssueHistory>()
                .HasOne(h => h.ChangedByUser)
                .WithMany(u => u.ChangedIssues)
                .HasForeignKey(h => h.ChangedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // IssueMedia → Issue
            modelBuilder.Entity<IssueMedia>()
                .HasOne(m => m.Issue)
                .WithMany(i => i.IssueMedia)
                .HasForeignKey(m => m.IssueId)
                .OnDelete(DeleteBehavior.Cascade);

            // AuditLog → User
            modelBuilder.Entity<AuditLog>()
                .HasOne(a => a.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
