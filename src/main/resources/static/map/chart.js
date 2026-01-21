// make sure date sticks to correct "yyyy-mm-dd" and doesnt shift hours around
function formatLocalDate(dateStr) {
    const d  = String(dateStr).slice(0, 10);
    const [yr, mnth, day] = d.split("-").map(Number);
    const localDate = new Date(yr, mnth - 1, day);
    return localDate
}


export function initTrendChart() {
    const ctx = document.getElementById("trendChart");
    return new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          
          // region selected
          {
            label: "Regional Average ($)",
            data: [],
            tension: 0.25,
            pointRadius: 2,
            borderColor: "#3457a3",
            backgroundColor: "#3457a3",
            borderWidth: 2
          },

          // national
          {
            label: "National Average ($)",
            data: [],
            hidden: true,
            tension: 0.25,
            pointRadius: 2,
            borderColor: "#e3ab4b",
            backgroundColor: "#e3ab4b",
            borderDash: [10,5],
            borderWidth: 2
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d, yyyy"
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 6,
              maxRotation: 30,
              minRotation: 30
            }
          },

          y: {
            ticks: {
              callback: (val) => `$${Number(val).toFixed(2)}`
            }
          }
        },

        plugins: {
          legend: {
            labels: {
              filter: (legendItem, data) => {
                const dSet = data.datasets[legendItem.datasetIndex];
                return !dSet.hidden && !!dSet.label;
              }
            }
          },

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
  
  export function updateTrendChart(chart, points, scopeLabel, itemName, nationalPoints = null) { // points = [{date, avgCents, storeCount}, ...]
      const region = chart.data.datasets[0];
      const nat = chart.data.datasets[1];

      const toXY = (arr) => arr.map(p => ({
        x: formatLocalDate(p.date),
        y: Number(p.avgCents) / 100,
        _meta: { storeCount: p.storeCount }
      }));

      if (String(scopeLabel).startsWith("National")) {
        chart.data.labels = points.map(p => p.date);

        nat.data = toXY(points);

        nat.label = "National Average ($)";

        nat.borderColor = "#e3ab4b";
        nat.backgroundColor = "#e3ab4b";

        nat.hidden = false;

        region.data = [];
        region.hidden = true;
        region.label = "";

      } else {
        chart.data.labels = points.map(p => p.date);
        
        region.data = toXY(points);
        region.hidden = false;
        region.label = "Regional Average ($)";

        if (nationalPoints) {
          nat.data = toXY(nationalPoints);

          nat.label = "National Average ($)";

          nat.borderColor = "#e3ab4b";
          nat.backgroundColor = "#e3ab4b";

          nat.hidden = false;
        }
      }

      chart.options.plugins.title.text = [scopeLabel, `Average Price ($) - ${String(itemName)}`];
      chart.update();
  }
  