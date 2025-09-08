import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name
        });
      } else {
        await login(formData.username, formData.password);
      }
      
      setLocation('/');
      toast({
        title: isRegisterMode ? 'Account created successfully' : 'Welcome back!',
        description: isRegisterMode ? 'You can now access your farm dashboard.' : 'You have been logged in successfully.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error.message || 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center neon-glow">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold neon-text text-primary">AgriTech IoT</h1>
              <p className="text-sm text-muted-foreground">Farm Management System</p>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isRegisterMode 
                ? 'Set up your farm management account'
                : 'Sign in to access your farm dashboard'
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    data-testid="input-email"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                data-testid="input-password"
              />
            </div>

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  data-testid="input-confirm-password"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full neon-glow" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Please wait...' : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </Button>

            {/* Clear localStorage button for debugging */}
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                localStorage.clear();
                toast({
                  title: 'Browser data cleared',
                  description: 'Please try logging in again.'
                });
              }}
              data-testid="button-clear-data"
            >
              Clear Stored Data
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                data-testid="button-toggle-mode"
              >
                {isRegisterMode 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
