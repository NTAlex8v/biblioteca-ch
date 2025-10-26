
"use client";

import React from "react";

// Este layout ahora solo proporciona la estructura visual.
// La lógica de permisos se manejará en cada página específica del panel de admin.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <div className="container mx-auto py-8">
        {children}
    </div>
  );
}
