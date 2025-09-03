@echo off
echo Setting up Smart Student Pathway Decider Backend...
echo.

echo 1. Copying environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please update with your configuration.
) else (
    echo .env file already exists.
)

echo.
echo 2. Installing dependencies...
call npm install

echo.
echo 3. Creating database tables...
node migrations/createTables.js

echo.
echo 4. Setup complete!
echo.
echo To start the development server:
echo npm run dev
echo.
echo Make sure XAMPP MySQL is running and update your .env file with the correct database credentials.
pause
