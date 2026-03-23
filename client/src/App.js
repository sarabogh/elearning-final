import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetails from './pages/CourseDetails';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CourseSearch from './pages/CourseSearch';
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f4c81',
      dark: '#0a3458',
      light: '#3473a6'
    },
    secondary: {
      main: '#dd6b20',
      dark: '#b45309',
      light: '#f59e0b'
    },
    success: {
      main: '#2f855a',
    },
    warning: {
      main: '#c05621'
    },
    info: {
      main: '#2b6cb0'
    },
    background: {
      default: '#f2f6fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#102a43',
      secondary: '#486581'
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: ['"Manrope"', '"Segoe UI"', 'sans-serif'].join(','),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 750 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700 }
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: 20,
          paddingBottom: 28
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(15, 76, 129, 0.12)',
          boxShadow: '0 12px 24px rgba(15, 76, 129, 0.08)'
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(15, 76, 129, 0.12)',
          boxShadow: '0 10px 20px rgba(15, 76, 129, 0.06)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          overflow: 'hidden'
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          padding: '10px 18px',
          letterSpacing: '0.01em'
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f4c81 0%, #1f7ab6 100%)',
          boxShadow: '0 12px 20px rgba(15, 76, 129, 0.25)'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 50
        },
        indicator: {
          height: 3,
          borderRadius: 999
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 50,
          fontWeight: 700
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <Navbar />
          <Box className="app-shell">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-course" element={<CreateCourse />} />
              <Route path="/course/:id" element={<CourseDetails />} />
              <Route path="/course/:id/edit" element={<EditCourse />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/search" element={<CourseSearch />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;