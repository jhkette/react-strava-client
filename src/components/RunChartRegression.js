import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import regression from "regression";
import { intervalToDuration } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function RunchartRegression({ userRecords, event, regdata }) {
  // https://www.youtube.com/watch?v=1b1wC1ksJoI
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const regData = regdata[0].dataset.map(({ x, y }) => {
    return [parseInt(x), parseInt(y)]; // we need a list of [[x1, y1], [x2, y2], ...]
  });
  let my_regression;
  let prediction;
  if (userRecords.runningpbs["5000"]) {
    my_regression = regression.linear(regData);

    prediction = my_regression.predict(userRecords.runningpbs["5000"])[1];
  }

  useEffect(() => {
    if (!userRecords.runningpbs["5000"] || !regdata) {
      return;
    }
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const myChartRef = chartRef.current.getContext("2d");
    // create  a new chart
    chartInstance.current = new Chart(myChartRef, {
      type: "line",
      data: {
        labels: regData.map((item) => item[0]),
        datasets: [
          {
            type: "line",
            label: `5k-${event} dataset`,
            data: regData.map((item) => item[1]),
            fill: false,
            borderColor: "rgb(54, 162, 235)",
            showLine: false,
          },
          {
            type: "line",
            label: "Linear regression line",
            data: my_regression.points.map((data) => data[1]),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            showLine: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            enabled: false, // <-- this option disables tooltips
          },
          annotation: {
            annotations: {
              point1: {
                type: "point",
                xValue: userRecords.runningpbs["5000"],
                yValue: prediction,
                backgroundColor: "rgba(255, 99, 132, 0.25)",
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "5k time",
              font: {
                weight: "bold",
                size: 22,
              },
            },
            type: "linear",
            beginAtZero: false,
            ticks: {
              stepSize: 120,
              color: "#1a1a1a",
              font: {
                fontSize: "8pts",
              },
              callback: (val) => {
                if (val < 60) {
                  return `${val} seconds`;
                }
                const remainder = val % 60;
                const minutes = (val - remainder) / 60;
                return `${minutes}:00`;
              },
            },
          },
          y: {
            title: {
              display: true,
              text: `${event} time`,
              font: {
                weight: "bold",
                size: 22,
              },
            },
            ticks: {
              stepSize: 120,
              color: "#1a1a1a",
              font: {
                fontSize: "8pts",
              },
              callback: (val) => {
                if (val < 60) {
                  return `${val} seconds`;
                }
                const remainder = val % 60;
                const minutes = (val - remainder) / 60;
                if (val < 60) {
                  return `${minutes}mins`;
                }
                let hoursRemainder = minutes % 60;

                const hours = (minutes - hoursRemainder) / 60;
                if (hoursRemainder < 10) {
                  hoursRemainder = `0${hoursRemainder}`;
                }
                return `${hours}:${hoursRemainder}`;
              },
            },
          },
        },
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [userRecords, prediction, regData, my_regression.points, event, regdata]);

  function humanDuration(time) {
    return intervalToDuration({ start: 0, end: time * 1000 });
  }

  let fivekFormat, predFormat;
  if (prediction && userRecords.runningpbs) {
    predFormat = humanDuration(prediction);
    fivekFormat = humanDuration(userRecords.runningpbs["5000"]);
  }

  return userRecords.runningpbs ? (
    <div className="bg-white m-auto p-8">
      <canvas ref={chartRef} style={{ width: "300px", height: "200px" }} />

      <h3>
        Five km time: {fivekFormat["minutes"]}:{fivekFormat["seconds"]}
      </h3>

      <h3 className="border-b-2 border-rose-500 inline-block">
        {event} prediction: {predFormat["hours"]}:{predFormat["minutes"]}
      </h3>
    </div>
  ) : (
    <p>
      {" "}
      <FontAwesomeIcon icon={faSpinner} spinPulse />
    </p>
  );
}
