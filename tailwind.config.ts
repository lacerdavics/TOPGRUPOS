import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': [
					'Inter', 
					'system-ui', 
					'-apple-system', 
					'BlinkMacSystemFont', 
					'Segoe UI', 
					'Roboto', 
					'sans-serif'
				],
				'heading': [
					'Inter', 
					'system-ui', 
					'-apple-system', 
					'BlinkMacSystemFont', 
					'Segoe UI', 
					'Roboto', 
					'sans-serif'
				],
			},
			screens: {
				'xs': '475px',
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px',
			},
		colors: {
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))',
				light: 'hsl(var(--primary-light))',
				dark: 'hsl(var(--primary-dark))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))',
				light: 'hsl(var(--accent-light))',
				dark: 'hsl(var(--accent-dark))'
			},
			// iPhone Prata specific colors
			glass: {
				DEFAULT: 'rgba(255, 255, 255, 0.1)',
				light: 'rgba(255, 255, 255, 0.15)',
				dark: 'rgba(255, 255, 255, 0.05)'
			},
			metallic: {
				DEFAULT: 'hsl(36 8% 62%)', // #9e9a95
				light: 'hsl(36 12% 71%)', // #bcb9b4  
				dark: 'hsl(36 8% 52%)',
				foreground: 'hsl(0 0% 100%)'
			},
			ice: {
				DEFAULT: 'hsl(191 91% 67%)', // #5fd0f0
				light: 'hsl(191 91% 77%)',
				dark: 'hsl(191 91% 57%)',
				foreground: 'hsl(0 0% 100%)'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			success: {
				DEFAULT: 'hsl(var(--success))',
				foreground: 'hsl(var(--success-foreground))',
				light: 'hsl(var(--success-light))'
			},
			warning: {
				DEFAULT: 'hsl(var(--warning))',
				foreground: 'hsl(var(--warning-foreground))',
				light: 'hsl(var(--warning-light))'
			},
			info: {
				DEFAULT: 'hsl(var(--info))',
				foreground: 'hsl(var(--info-foreground))',
				light: 'hsl(var(--info-light))'
			},
			// Cores da paleta específica
			'light-green': {
				DEFAULT: 'hsl(var(--light-green))',
				foreground: 'hsl(var(--light-green-foreground))'
			},
			sage: {
				DEFAULT: 'hsl(var(--sage))',
				foreground: 'hsl(var(--sage-foreground))'
			},
			'dark-purple': {
				DEFAULT: 'hsl(var(--dark-purple))',
				foreground: 'hsl(var(--dark-purple-foreground))'
			},
			premium: {
				DEFAULT: 'hsl(var(--premium))',
				foreground: 'hsl(var(--premium-foreground))',
				light: 'hsl(var(--premium-light))'
			},
			online: {
				DEFAULT: 'hsl(var(--online))',
				foreground: 'hsl(var(--online-foreground))'
			},
			verified: {
				DEFAULT: 'hsl(var(--verified))',
				foreground: 'hsl(var(--verified-foreground))'
			}
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)',
			xl: 'calc(var(--radius) + 4px)',
			'2xl': 'calc(var(--radius) + 8px)',
			'3xl': 'calc(var(--radius) + 12px)'
		},
		backgroundImage: {
			'gradient-metallic': 'var(--gradient-metallic)',
			'gradient-glass': 'var(--gradient-glass)',
			'gradient-ice': 'var(--gradient-ice)',
			'gradient-hero': 'var(--gradient-hero)',
		},
		backdropBlur: {
			'glass': '20px',
			'glass-sm': '10px',
			'glass-lg': '30px',
		},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				// Modal-specific animations
				'modal-overlay-enter': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'modal-overlay-exit': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'modal-content-enter': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(20px) scale(0.95)' 
					},
					'50%': { 
						opacity: '0.8', 
						transform: 'translateY(-2px) scale(1.02)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0) scale(1)' 
					}
				},
				'modal-content-exit': {
					'0%': { 
						opacity: '1', 
						transform: 'translateY(0) scale(1)' 
					},
					'100%': { 
						opacity: '0', 
						transform: 'translateY(20px) scale(0.95)' 
					}
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.6)' }
				},
				'floating': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-3px)' }
				},
				'gradient-shift': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(-1deg)' },
					'50%': { transform: 'rotate(1deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				// Modal animations
				'modal-overlay-in': 'modal-overlay-enter 0.3s ease-out',
				'modal-overlay-out': 'modal-overlay-exit 0.2s ease-out',
				'modal-in': 'modal-content-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'modal-out': 'modal-content-exit 0.3s cubic-bezier(0.4, 0, 1, 1)',
				// Existing animations
				'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
				'floating': 'floating 6s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
				'bounce-subtle': 'bounce-subtle 4s ease-in-out infinite',
				'glow': 'pulse-glow 3s ease-in-out infinite',
				'shake': 'shake 0.5s ease-in-out',
				'wiggle': 'wiggle 1s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require('tailwind-scrollbar')],
} satisfies Config;
