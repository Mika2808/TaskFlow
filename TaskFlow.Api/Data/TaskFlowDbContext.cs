using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Models.Entities;

public class TaskFlowDbContext : DbContext
{
    public TaskFlowDbContext(DbContextOptions<TaskFlowDbContext> options)
        : base(options)
    {
    }
    public DbSet<User> Users { get; set; }
    public DbSet<TaskEntity> Tasks { get; set; }
    public DbSet<TaskGroup> TaskGroups { get; set; }
}