import { Link } from 'react-router-dom'
import { ParkingCircle, Brain, MapPin, Clock, BarChart3, Zap, Shield, ArrowRight } from 'lucide-react'

const features = [
  { icon: Brain, title: 'Smart Slot Recommendation', desc: 'AI analyzes vehicle type, proximity, and availability to suggest the optimal parking spot.' },
  { icon: MapPin, title: 'Animated Simulation', desc: 'Watch vehicles navigate and park in real-time with our interactive 2D canvas simulation.' },
  { icon: Clock, title: 'Real-Time Availability', desc: 'Get instant updates on slot availability across all parking zones.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Track occupancy trends, revenue patterns, and peak hours with interactive charts.' },
  { icon: Shield, title: 'Violation Detection', desc: 'AI-powered monitoring detects illegal parking and unauthorized access in real-time.' },
  { icon: Zap, title: 'EV Charging Zones', desc: 'Dedicated zones for electric vehicles with integrated charging station management.' },
]

const steps = [
  { num: '01', title: 'Enter the Parking Lot', desc: 'Drive up to the entrance. Our sensors detect your vehicle type automatically.' },
  { num: '02', title: 'AI Finds Your Spot', desc: 'Our AI engine analyzes real-time data and assigns the optimal parking slot.' },
  { num: '03', title: 'Navigate with Ease', desc: 'Follow the smart guidance system to your reserved spot effortlessly.' },
  { num: '04', title: 'Exit When Ready', desc: 'Drive to the exit. Payment is calculated automatically based on duration.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="fixed top-0 w-full bg-dark-950/80 backdrop-blur-md border-b border-dark-800/50 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <ParkingCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">SmartParking</h1>
              <p className="text-[10px] text-cyan-400 tracking-wider">AI SYSTEM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-dark-300 hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-medium mb-8">
            <Brain className="w-3.5 h-3.5" />
            AI-Powered Parking Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            AI-Powered Smart
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Parking Management
            </span>
          </h1>
          <p className="text-lg text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience the future of parking with our intelligent system that uses artificial intelligence 
            to optimize slot allocation, reduce congestion, and enhance your parking experience.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-dark-800 hover:bg-dark-700 text-dark-200 font-medium rounded-xl transition-all duration-200 border border-dark-700"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Powerful Features</h2>
            <p className="text-dark-400">Everything you need for intelligent parking management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-dark-800/40 border border-dark-700/50 rounded-xl p-6 hover:border-primary-500/30 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-dark-400 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-dark-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-dark-400">Four simple steps to smart parking</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center relative">
                <div className="text-4xl font-bold text-primary-500/20 mb-3">{s.num}</div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-dark-400 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-5 h-5 text-dark-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-dark-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ParkingCircle className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-medium text-dark-300">SmartParking AI</span>
          </div>
          <p className="text-xs text-dark-500">Built with AI-powered intelligence for modern cities.</p>
        </div>
      </footer>
    </div>
  )
}
