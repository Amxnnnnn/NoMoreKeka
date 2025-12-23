import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Building2, ArrowRight, Lock, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Secure Admin Onboarding",
    description: "Multi-step verification ensures only authorized administrators gain access.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Fine-grained permissions for HR, Managers, and Employees.",
  },
  {
    icon: Building2,
    title: "Organization Structure",
    description: "Clear departmental hierarchy with comprehensive oversight.",
  },
  {
    icon: Lock,
    title: "Audit-Ready",
    description: "Complete transparency with detailed activity logging.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "256-bit", label: "Encryption" },
  { value: "SOC 2", label: "Compliant" },
  { value: "24/7", label: "Support" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Premium background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] translate-y-1/2" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <div className="container relative mx-auto px-6 py-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-16 lg:mb-24"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <span className="font-bold text-xl text-foreground tracking-tight">NoMoreKeka</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Enterprise</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth/login")}
              className="shadow-sm"
            >
              Sign In
            </Button>
          </motion.header>

          {/* Hero Content */}
          <div className="max-w-5xl mx-auto text-center pb-16 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary text-sm font-medium mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Admin Registration Panel — Signity Solutions
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight"
            >
              Enterprise HRMS
              <br />
              <span className="text-gradient">Built for Leaders</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Secure, scalable, and audit-ready human resource management. 
              Designed for organizations that value clarity, responsibility, and trust.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate("/auth/register")}
                className="group w-full sm:w-auto"
              >
                Register as Admin
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => navigate("/auth/login")}
                className="w-full sm:w-auto bg-background/50 backdrop-blur-sm"
              >
                Sign In
              </Button>
            </motion.div>

            {/* Trust Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 pt-12 border-t border-border/50"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-muted/50 to-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03)_0%,transparent_70%)]" />
        
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
              <CheckCircle2 className="w-3 h-3" />
              Enterprise-Grade Security
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Built for Enterprise Trust
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Every feature designed with security, clarity, and scalability in mind.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group enterprise-card p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center mb-5 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-[0.03]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        
        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              Get Started Today
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
              Ready to transform your HR operations?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join leading organizations using NoMoreKeka for secure, efficient HR management.
            </p>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate("/auth/register")}
              className="group shadow-xl shadow-primary/20"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • 14-day free trial
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-6">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-xl md:text-2xl text-foreground/80 italic leading-relaxed mb-4">
              "Leadership is not about being in charge. It's about taking care of those in your charge."
            </p>
            <footer className="text-muted-foreground">— Simon Sinek</footer>
          </motion.blockquote>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">NoMoreKeka</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NoMoreKeka by Signity Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
