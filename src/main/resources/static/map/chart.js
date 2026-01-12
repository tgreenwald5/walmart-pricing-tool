export function initTrendChart() {
    const ctx = document.getElementById("trendChart");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "Average Price ($)",
          data: [],
          tension: 0.25,
          pointRadius: 2,
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          y: {
            ticks: {
              callback: (val) => `$${val}`
            }
          }
        },

        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const p = ctx.raw?._meta;
                return p && p.storeCount != null ? `# of Stores Sampled: ${p.storeCount}` : "";
              }
            }
          }
        }
      }
    });
  }
  
  export function updateTrendChart(chart, points, title) { // points = [{date, avgCents, storeCount}, ...]
    chart.data.labels = points.map(p => p.date);
    chart.data.datasets[0].data = points.map(p => ({
      x: p.date,
      y: Number(p.avgCents) / 100,
      _meta: { storeCount: p.storeCount }
    }));
  
    chart.data.datasets[0].label = title || "Average Price ($)";
    chart.update();
  }
  