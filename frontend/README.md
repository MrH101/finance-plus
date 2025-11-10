# Finance Plus Frontend

A modern web application for managing personal finances, built with React, TypeScript, and Redux Toolkit.

## Features

- Dashboard with financial overview
- Transaction management
- Financial reports and analytics
- User settings and profile management
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-plus.git
   cd finance-plus/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production bundle
- `npm run preview` - Preview the production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── hooks/         # Custom React hooks
  ├── pages/         # Page components
  ├── store/         # Redux store and slices
  ├── utils/         # Utility functions
  ├── __tests__/     # Test files
  ├── App.tsx        # Main App component
  └── main.tsx       # Application entry point
```

## Testing

The project uses Vitest and React Testing Library for testing. Run tests with:

```bash
npm test
```

For test coverage:

```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
