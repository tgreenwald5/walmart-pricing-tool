export function initTrendChart() {
    const ctx = document.getElementById("trendChart");
    return new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          
          // region selected
          {
            label: "Average Price ($)",
            data: [],
            tension: 0.25,
            pointRadius: 2,
            borderColor: "#28a155",
            backgroundColor: "#28a155",
            borderWidth: 2
          },

          // national
          {
            label: "National Average ($)",
            data: [],
            hidden: true,
            tension: 0.25,
            pointRadius: 2,
            borderColor: "#c44d45",
            backgroundColor: "#c44d45",
            borderWidth: 2
          }
        ]
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
    chart.data.labels = points.map(p => p.date);

    chart.data.datasets[0].data = points.map(p => ({
      x: p.date,
      y: Number(p.avgCents) / 100,
      _meta: { storeCount: p.storeCount }
    }));

    if (nationalPoints) {
      chart.data.datasets[1].data = nationalPoints.map(p => ({
        x: p.date,
        y: Number(p.avgCents) / 100,
        _meta: { storeCount: p.storeCount }
      }));
      chart.data.datasets[1].hidden = false;
    } else {
      chart.data.datasets[1].data = [];
      chart.data.datasets[1].hidden = true;
    }

    chart.options.plugins.title.text = [
      scopeLabel,
      `Average Price ($) - ${String(itemName)}`

    ];
    chart.update();
  }
  