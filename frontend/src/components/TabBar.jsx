import React from "react";
import { NavLink } from "react-router-dom";
import { DashboardIcon, ConnectIcon, BotIcon } from "./Icons.jsx";

export default function TabBar() {
  return (
    <div className="tabBar">
      <NavLink to="/dashboard" className={({isActive}) => `tab ${isActive ? "active" : ""}`}>
        <DashboardIcon />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/integrations" className={({isActive}) => `tab ${isActive ? "active" : ""}`}>
        <ConnectIcon />
        <span>Integrations</span>
      </NavLink>

      <NavLink to="/chatbot" className={({isActive}) => `tab ${isActive ? "active" : ""}`}>
        <BotIcon />
        <span>Chat bot</span>
      </NavLink>
    </div>
  );
}
