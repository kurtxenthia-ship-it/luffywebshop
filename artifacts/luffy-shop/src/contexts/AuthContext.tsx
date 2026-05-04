import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey, useLogout } from "@workspace/api-client-react";

interface User {
  id: number;
  userId: string;
  email: string;
  username: string;
  balance: number;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const logoutMutation = useLogout();

  const { data, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (data) {
      setLocalUser(data as User);
    }
  }, [data]);

  const setUser = (user: User | null) => {
    setLocalUser(user);
    queryClient.setQueryData(getGetMeQueryKey(), user);
  };

  const logout = () => {
    logoutMutation.mutate({}, {
      onSettled: () => {
        setLocalUser(null);
        queryClient.clear();
        window.location.href = "/";
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user: localUser, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
