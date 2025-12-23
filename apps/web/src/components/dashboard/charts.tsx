'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Define chart config interface
interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

// Project status chart component
interface ProjectStatusChartProps {
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  draftProjects: number;
}

export function ProjectStatusChart({ 
  activeProjects, 
  completedProjects, 
  pendingProjects, 
  draftProjects 
}: ProjectStatusChartProps) {
  // Define chart data
  const chartData = [
    { status: 'Active', projects: activeProjects, fill: 'var(--color-active)' },
    { status: 'Completed', projects: completedProjects, fill: 'var(--color-completed)' },
    { status: 'Pending', projects: pendingProjects, fill: 'var(--color-pending)' },
    { status: 'Draft', projects: draftProjects, fill: 'var(--color-draft)' },
  ];

  // Define chart configuration
  const chartConfig = {
    projects: {
      label: 'Projects',
    },
    active: {
      label: 'Active',
      color: 'hsl(var(--chart-1))',
    },
    completed: {
      label: 'Completed',
      color: 'hsl(var(--chart-2))',
    },
    pending: {
      label: 'Pending',
      color: 'hsl(var(--chart-3))',
    },
    draft: {
      label: 'Draft',
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig;

  // Calculate total projects
  const totalProjects = activeProjects + completedProjects + pendingProjects + draftProjects;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Project Status</CardTitle>
        <CardDescription>Breakdown of your projects by status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="projects"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalProjects}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Projects
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <TrendingUp className="h-4 w-4" />
          {activeProjects} Active Projects
        </div>
        <div className="leading-4 text-muted-foreground">
          {completedProjects} projects completed this period
        </div>
      </CardFooter>
    </Card>
  );
}

// Financial chart component
interface FinancialChartProps {
  totalBudget: number;
  totalSpent: number;
  pendingPayments: number;
  availableFunds: number;
}

export function FinancialChart({ 
  totalBudget, 
  totalSpent, 
  pendingPayments, 
  availableFunds 
}: FinancialChartProps) {
  // Define chart data
  const chartData = [
    { type: 'Spent', amount: totalSpent, fill: 'var(--color-spent)' },
    { type: 'Pending', amount: pendingPayments, fill: 'var(--color-pending)' },
    { type: 'Available', amount: availableFunds, fill: 'var(--color-available)' },
  ];

  // Define chart configuration
  const chartConfig = {
    amount: {
      label: 'Amount',
    },
    spent: {
      label: 'Spent',
      color: 'hsl(var(--chart-1))',
    },
    pending: {
      label: 'Pending',
      color: 'hsl(var(--chart-2))',
    },
    available: {
      label: 'Available',
      color: 'hsl(var(--chart-3))',
    },
  } satisfies ChartConfig;

  // Calculate total
  const total = totalSpent + pendingPayments + availableFunds;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Distribution of your funds</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          ${total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Budget
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <TrendingUp className="h-4 w-4" />
          ${totalSpent.toLocaleString()} Spent
        </div>
        <div className="leading-4 text-muted-foreground">
          ${pendingPayments.toLocaleString()} pending payments
        </div>
      </CardFooter>
    </Card>
  );
}

// Project timeline chart component
interface ProjectTimelineChartProps {
  projects: any[]; // Array of projects with start/end dates
}

export function ProjectTimelineChart({ projects }: ProjectTimelineChartProps) {
  // This would be implemented as a Gantt chart or timeline visualization
  // For now, we'll create a placeholder
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Your projects over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Project timeline visualization would appear here
        </div>
      </CardContent>
    </Card>
  );
}