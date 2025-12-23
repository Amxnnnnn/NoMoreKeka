import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Building2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getInvitationDetails, acceptInvitation } from "@/services/invitation.service";

const acceptInvitationSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

interface InvitationDetails {
  email: string;
  name: string;
  role: string;
  companyName: string;
  departmentName?: string;
  expiresAt: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Fetch invitation details on component mount
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setError("Invalid invitation link. No token provided.");
        setIsLoadingDetails(false);
        return;
      }

      try {
        const result = await getInvitationDetails(token);
        
        if (result.success && result.invitation) {
          setInvitationDetails(result.invitation);
          
          // Check if invitation is expired
          const expiresAt = new Date(result.invitation.expiresAt);
          const now = new Date();
          
          if (now > expiresAt) {
            setError("This invitation has expired. Please request a new invitation.");
          }
        } else {
          setError("Invalid or expired invitation.");
        }
      } catch (error: any) {
        console.error('Failed to fetch invitation details:', error);
        setError(error.message || "Failed to load invitation details.");
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid invitation",
        description: "No invitation token found.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await acceptInvitation({
        token,
        password: data.password,
      });

      if (result.success && result.user && result.token) {
        toast({
          title: "Welcome to the team!",
          description: "Your account has been created successfully. Please login with your credentials.",
        });

        // Redirect to login page instead of auto-login
        navigate("/auth/login");
      }
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "HR":
        return "default";
      case "EMPLOYEE":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Loading state
  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Loading invitation details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitationDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {error || "This invitation is no longer valid."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              Complete your account setup to join the team
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Invitation Details */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{invitationDetails.name}</p>
                  <p className="text-sm text-muted-foreground">{invitationDetails.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{invitationDetails.companyName}</p>
                  {invitationDetails.departmentName && (
                    <p className="text-sm text-muted-foreground">{invitationDetails.departmentName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant={getRoleVariant(invitationDetails.role) as any}>
                  {invitationDetails.role}
                </Badge>
              </div>
            </div>

            {/* Password Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    "Accept Invitation & Join Team"
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => navigate("/auth/login")}
                >
                  Sign in instead
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}