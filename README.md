# Philadelphia Chord Book

A modern, full-featured chord book application for worship teams and musicians. Built with React, Express, and Tailwind CSS.

## Features

- 🎵 **Song Management**: Organize songs by categories (Prayer, Hymn, Praise, Worship, Christmas, Communion)
- 🔍 **Universal Search**: Find any song across all folders with instant search
- 🎹 **Chord Display**: Beautiful chord highlighting with transposition support
- 📱 **Presentation Mode**: Fullscreen presentation with two-column layout
- 🔧 **Zoom Controls**: Adjustable font size for optimal readability
- ✏️ **Song Editor**: Create and edit songs with live preview
- 💾 **Persistent Storage**: Backend API for universal data storage
- 🎨 **Modern UI**: Clean, premium design with Tailwind CSS

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Storage**: JSON file-based storage
- **Icons**: Lucide React icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/philadelphia-chord-book.git
cd philadelphia-chord-book
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
npm run dev:all
```

This will start both the frontend (React) and backend (Express) servers concurrently.

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend API server
- `npm run dev:all` - Start both frontend and backend servers
- `npm run build` - Build for production

## Usage

1. **Browse Songs**: Select a folder from the sidebar to view songs
2. **Search**: Use the search bar to find songs across all folders
3. **View Song**: Click on a song to view it with chord highlighting
4. **Transpose**: Use the up/down arrows to transpose chords
5. **Present**: Click the present button for fullscreen presentation mode
6. **Edit**: Click the edit button to modify song content
7. **Create**: Add new songs and folders as needed

## Song Data Structure

Songs are stored in `data/songs.json` with the following structure:

```json
{
  "folderName": [
    {
      "title": "Song Title",
      "key": "G",
      "style": "Worship",
      "tempo": "120",
      "lyrics": "[G] Song lyrics with [chords]"
    }
  ]
}
```

## Chord Notation

- `[G]` - Single brackets hide the brackets, show only the chord
- `[[G]]` - Double brackets show one set of brackets around the chord
- `[Gsus G]` - Multiple chords in one bracket are all transposed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for worship teams and musicians
- Inspired by the need for modern, digital chord books
- Special thanks to the Philadelphia community
