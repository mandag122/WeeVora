export function Stats() {
  const stats = [
    { value: "50+", label: "Camps Listed" },
    { value: "100%", label: "Free to Use" },
    { value: "Lake County", label: "Coverage" }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-eggplant to-eggplant-light text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2" data-testid={`stat-${index}`}>
              <div className="text-4xl md:text-5xl font-bold text-gold">
                {stat.value}
              </div>
              <div className="text-white/80 text-lg">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
