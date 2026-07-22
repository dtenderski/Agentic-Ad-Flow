import * as React from "react"
import { Activity, Briefcase, Plus, CopyPlus, Play, CheckCircle, Database, Server, Settings, Home, Target, MapPin, Search } from "lucide-react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/businesses", label: "Businesses", icon: Briefcase },
    { href: "/pipeline", label: "Pipelines", icon: Server },
    { href: "/blueprints", label: "Blueprints", icon: CopyPlus },
    { href: "/campaigns", label: "Campaigns", icon: Target },
    { href: "/approvals", label: "Human Gate", icon: CheckCircle },
    { href: "/memory", label: "Agent Memory", icon: Database },
  ]

  return (
    <div className="flex min-h-[100dvh] w-full bg-background dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight uppercase">AdClaw<span className="text-foreground">.AI</span></span>
          </div>
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50">
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center text-sm text-muted-foreground">
            {/* Breadcrumb pseudo */}
            <span className="capitalize">{location === "/" ? "Overview" : location.split('/')[1]}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-secondary border border-border rounded-full h-8 pl-9 pr-4 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/30">
              U
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
