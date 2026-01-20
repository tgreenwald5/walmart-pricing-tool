# Walmart Price Analytics
Fetches daily Walmart prices for commonly purchased groceries across ~4,000 stores in the United States. The data is 
aggregated into state and county level averages and visualized with interactive maps and trend charts.

**Live Demo:** [https://wm-price-analytics.taylorgreenwald.com/](https://wm-price-analytics.taylorgreenwald.com/)


## Features
- Daily price collection across ~4,000 Walmart stores
- State and county level price aggregation with individual store level viewing
- Interactive choropleth maps
- Latest price averages
- Historical price trend charts
- Regional store count tracking
- Deployed live demo


## UI Preview
<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/164097d9-5342-4e1c-a09a-7ad2463092c9" width="500"><br>
      <sub>National View</sub>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/73a29f58-0eab-4525-99bc-d7552ca6d66a" width="500"><br>
      <sub>State View</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/0912b605-a838-478d-b2cc-f4fb3fa1c82c" width="500"><br>
      <sub>County View</sub>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/3fdfe35b-5d25-4162-b747-fe266dff672a" width="500"><br>
      <sub>Store View</sub>
    </td>
  </tr>
</table>


## Tech Stack

### Backend & APIs
- Java (Spring Boot)
- PostgreSQL
- SQL
- Walmart Affiliate API

### Frontend
- JavaScript
- Mapbox GL JS
- Chart.js
- HTML / CSS

### Cloud & Deployment
- Docker
- AWS ECS
- AWS RDS
- AWS ECR
- AWS ALB


## Architecture

### Data Collection Pipeline
- Prices are fetched daily from Walmart Affiliate API
- Each run fetches prices for tracked items across ~4,000 stores
- Price data is stored in PostgreSQL (AWS RDS)


### Database Design

#### Tables
**stores**
- One row per Walmart store
- Includes a unique store ID
- Stores geographic identifiers (state and county FIPS codes) used for regional aggregation

**items**
- One row per tracked product
- Includes a unique item ID along with other data such as name and brand

**prices**
- Stores daily price snapshots
- Includes store ID, item ID, observed date, and price
- Used to compute both latest price averages and historical trends


### Backend
- Java Spring Boot REST API serving pricing summaries and historical trend data
- Endpoints allow for national, state, county, and store-level views
- SQL queries compute latest averages and store counts from stored daily snapshots
- Connects to PostgreSQL


### Frontend
- JavaScript UI built with Mapbox GL JS and Chart.js
- Displays state and county choropleth maps based on API responses
- Allows for state, county, and individual store interactions
- Displays historical price trends for the user's selected item and region

### Deployment
- Backend packaged as a Docker container
- Docker images pushed to AWS ECR
- Deployed on AWS ECS Fargate
- Traffic routed through an ALB
- PostgreSQL database hosted on AWS RDS


## TODO
- Find the best (and cheapest) way to schedule daily price collection from Walmart API
- Look into precomputing regional aggregates and whether it will save a meaningful amount of resources
- Expand tracked item list
- Improve UI, especially on mobile
