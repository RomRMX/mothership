# Las Vegas Restaurant Finder

This application uses the Google Places API to find all restaurants in Las Vegas, NV.

## Features

- **Search**: Finds restaurants in Las Vegas using Google Places Text Search.
- **Pagination**: Loads more results as you scroll or click "Load More".
- **Download CSV**: Exports the list of found restaurants to a CSV file.
- **Responsive Design**: Works on desktop and mobile.

## Prerequisites

You need a **Google Maps API Key** with the **Places API** and **Maps JavaScript API** enabled.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Places API** and **Maps JavaScript API**.
4. Create an API Key in **Credentials**.
5. (Optional) Restrict the API key to your domain for security.

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

4. Enter your Google Maps API Key when prompted.

## Notes

- The Google Places API returns up to 60 results per query (split into 3 pages of 20).
- To get more results, the app would need to implement a grid-based search strategy (searching smaller areas within Las Vegas), which is more complex and consumes more API quota. The current implementation uses a broad text search.
