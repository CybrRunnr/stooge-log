import Link from "next/link";
import { CalendarIcon, LibraryIcon, TrendingUpIcon, VoteIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
	{
		icon: LibraryIcon,
		title: "Backlog",
		description: "Group backlog with points, cover art, and completion tracking.",
		badge: "Live",
		href: "/backlog",
	},
	{
		icon: VoteIcon,
		title: "Voting",
		description: "Anonymous budget-allocation voting to prioritize what's next.",
		badge: "Live",
		href: "/vote",
	},
	{
		icon: TrendingUpIcon,
		title: "Burn rate",
		description: "Points completed over time with a projected finish date.",
		badge: "Phase 4",
	},
	{
		icon: CalendarIcon,
		title: "Events",
		description: "Session scheduling, RSVPs, and attendance tracking.",
		badge: "Phase 5",
	},
];

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Group progress at a glance — completion, what&apos;s being played, and what&apos;s
					next. Coming together phase by phase (see docs/ROADMAP.md).
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{modules.map((item) => {
					const card = (
						<Card
							key={item.title}
							className={item.href ? "hover:border-primary/50 h-full transition-colors" : "h-full"}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<item.icon className="size-4 text-primary" />
									{item.title}
									<Badge
										variant={item.badge === "Live" ? "default" : "secondary"}
										className="ml-auto"
									>
										{item.badge}
									</Badge>
								</CardTitle>
								<CardDescription>{item.description}</CardDescription>
							</CardHeader>
						</Card>
					);
					return item.href ? (
						<Link key={item.title} href={item.href}>
							{card}
						</Link>
					) : (
						card
					);
				})}
			</div>
		</div>
	);
}
