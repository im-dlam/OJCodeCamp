import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import {useCurrentUser} from "../hooks/useAuth";


const RequireAdmin: React.FC = () => {
  const {data , isPending,} = useCurrentUser();
  const location = useLocation();


  if (isPending) {
    return <div aria-busy="true">
            <div className="loader-stripe" style={{"margin":"0px auto"}}></div>
     </div>;
  }
  if (data?.role != "ADMIN") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <Outlet />
};

export default RequireAdmin;