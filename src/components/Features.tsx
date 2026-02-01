import folderIcon from "../assets/folder-icon.png";
import searchIcon from "../assets/search-icon.png";
import calendarIcon from "../assets/calendar-icon.png";

const features = [
  {
    icon: folderIcon,
    title: "Camp Directory",
    description: "Every summer camp in Lake County with registration dates, costs, and details."
  },
  {
    icon: searchIcon,
    title: "Smart Search & Filters",
    description: "Find exactly what you need by age, location, schedule, and activity type."
  },
  {
    icon: calendarIcon,
    title: "Plan Your Summer",
    description: "Select sessions and view them on a calendar to plan the perfect summer schedule."
  }
];

export function Features() {
  return (
    <section className="py-20 bg-white relative">
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(282 43% 30%) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-eggplant mb-4" data-testid="text-features-title">
            Planning summer just got easier
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to find and organize the best camps for your kids
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg p-8 shadow-paper hover:shadow-paper-hover transition-all hover:-translate-y-2 border border-border/50"
              data-testid={`card-feature-${index}`}
            >
              <div className="mb-6">
                <img 
                  src={feature.icon} 
                  alt={feature.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-eggplant mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
