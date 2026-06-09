import { useState } from "react";

import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useLoginUserMutation } from "../services/users/usersApi";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../store/slices/authSlice";

export function LoginPage() {
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginUserMutation();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});

    if (!formData.email) {
      setErrors({
        email: "Email is required",
      });
      return;
    }

    if (!formData.password) {
      setErrors({
        password: "Password is required",
      });
      return;
    }

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      const user = response.data;

      dispatch(setCurrentUser(user));
      // navigate('/');
    } catch (error: any) {
      setErrors({
        form: error?.data?.message || "Login failed",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Login to reserve your sneakers : Join to get exclusive drops
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {errors.form}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={formData.email}
              placeholder="you@example.com"
              error={errors.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              placeholder="Enter password"
              error={errors.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
