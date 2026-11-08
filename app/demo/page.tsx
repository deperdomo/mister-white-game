'use client';

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { DEMO_CODE, demoReset } from "../lib/demo-room";

const players = ['Ana', 'Luis', 'María de los Ángeles', 'Pablo', 'Sofía', 'Carlos', 'Lucía', 'Diego'];
const settings = { difficulty: 'easy', includeUndercover: true, misterWhites: 1, category: 'all' };
const config = encodeURIComponent(JSON.stringify({ players, settings }));

const sections = [
  {
    title: 'Juego local',
    links: [
      { label: 'Ajustes y jugadores', href: `/local?config=${config}` },
      { label: 'Partida (revelar roles)', href: `/local-game?config=${config}` },
    ],
  },
  {
    title: 'Sala online · como anfitrión',
    links: [
      { label: 'Sala de espera', href: `/waiting-room?code=${DEMO_CODE}&name=Ana` },
      { label: 'Partida', href: `/room/${DEMO_CODE}?name=Ana` },
    ],
  },
  {
    title: 'Sala online · como invitado',
    links: [
      { label: 'Sala de espera', href: `/waiting-room?code=${DEMO_CODE}&name=Luis` },
      { label: 'Partida', href: `/room/${DEMO_CODE}?name=Luis` },
    ],
  },
];

// Accesos directos a las pantallas reales con jugadores simulados.
export default function DemoPage() {
  // Cada acceso desde aquí empieza con la sala limpia
  useEffect(demoReset, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Demo de diseño</h1>
        <p className="mt-1 text-sm text-muted">Pantallas reales con 8 jugadores simulados. No se guarda nada.</p>
      </div>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.links.map((link) => (
              <Link key={link.href} href={link.href} className="block">
                <Button variant="secondary" className="w-full">{link.label}</Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
