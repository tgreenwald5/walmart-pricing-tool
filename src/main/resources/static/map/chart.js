export function initTrendChart() {
    const ctx = document.getElementById("trendChart");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          data: [],
          tension: 0.25,
          pointRadius: 3,
          borderColor: "#28a155",
          backgroundColor: "#28a155",
          borderWidth: 2
          //fill: false
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          y: {
            ticks: {
              callback: (val) => `$${Number(val).toFixed(2)}`
            }
          }
        },

        plugins: {
          title: {
            display: true,
            font: { size: 16, weight: "bold" },
            padding: { top: 10, bottom: 10 }
          },

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
  
  export function updateTrendChart(chart, points, scopeLabel, itemName) { // points = [{date, avgCents, storeCount}, ...]
    chart.data.labels = points.map(p => p.date);
    chart.data.datasets[0].data = points.map(p => ({
      x: p.date,
      y: Number(p.avgCents) / 100,
      _meta: { storeCount: p.storeCount }
    }));
    
    chart.data.datasets[0].label = "Average Price ($)";
    chart.options.plugins.title.text = [
      scopeLabel,
      `Average Price ($) - ${String(itemName)}`

    ];
    chart.update();
  }
  