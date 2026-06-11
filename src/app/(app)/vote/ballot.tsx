"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon, StarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setVote } from "@/server/votes";
import { cn } from "@/lib/utils";

export type BallotGame = {
	id: string;
	title: string;
	art: string | null;
	points: number | null;
	/** Group aggregate including the caller's own allocation. */
	groupTotal: number;
	/** The caller's own allocation. */
	mine: number;
};

export function Ballot({
	games,
	budget,
	maxPerGame,
}: {
	games: BallotGame[];
	budget: number;
	maxPerGame: number;
}) {
	const router = useRouter();
	const [, startTransition] = useTransition();

	const serverAllocations = Object.fromEntries(games.map((game) => [game.id, game.mine]));
	const [allocations, applyAllocation] = useOptimistic(
		serverAllocations,
		(state, update: { gameId: string; weight: number }) => ({
			...state,
			[update.gameId]: update.weight,
		})
	);

	const spent = Object.values(allocations).reduce((total, weight) => total + weight, 0);
	const remaining = budget - spent;

	function adjust(gameId: string, delta: number) {
		const current = allocations[gameId] ?? 0;
		const next = Math.max(0, Math.min(maxPerGame, current + delta));
		if (next === current) return;
		if (delta > 0 && remaining <= 0) return;

		startTransition(async () => {
			applyAllocation({ gameId, weight: next });
			try {
				await setVote(gameId, next);
			} catch {
				// Out of sync (e.g. budget race in another tab) — resync from server.
				router.refresh();
			}
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardContent className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">Your budget</p>
						<p className="text-muted-foreground text-xs">
							Spread up to {budget} points, max {maxPerGame} per game. Only totals are ever
							shown — nobody sees your picks.
						</p>
					</div>
					<p className="text-2xl font-semibold tabular-nums">
						{remaining}
						<span className="text-muted-foreground text-sm font-normal"> / {budget}</span>
					</p>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-3">
				{games.map((game) => {
					const mine = allocations[game.id] ?? 0;
					const groupTotal = game.groupTotal - game.mine + mine;
					return (
						<Card key={game.id} className="overflow-hidden py-0">
							<div className="flex items-center gap-4 pr-5">
								{game.art ? (
									<div className="relative h-20 w-40 shrink-0">
										<Image
											src={game.art}
											alt={game.title}
											fill
											className="object-cover"
											sizes="160px"
										/>
									</div>
								) : (
									<div className="bg-muted h-20 w-40 shrink-0" />
								)}
								<div className="min-w-0 flex-1 py-3">
									<p className="truncate text-sm font-semibold">{game.title}</p>
									<div className="mt-1 flex flex-wrap items-center gap-2">
										{game.points !== null && (
											<Badge variant="secondary" className="gap-1">
												<StarIcon className="size-3" />
												{game.points} pts
											</Badge>
										)}
										<span
											className={cn(
												"text-xs",
												groupTotal > 0 ? "text-primary" : "text-muted-foreground"
											)}
										>
											{groupTotal} group vote{groupTotal === 1 ? "" : "s"}
										</span>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Button
										size="icon"
										variant="outline"
										className="size-8"
										aria-label={`Remove a point from ${game.title}`}
										disabled={mine === 0}
										onClick={() => adjust(game.id, -1)}
									>
										<MinusIcon />
									</Button>
									<span
										className={cn(
											"w-6 text-center text-sm font-semibold tabular-nums",
											mine === 0 && "text-muted-foreground"
										)}
									>
										{mine}
									</span>
									<Button
										size="icon"
										variant="outline"
										className="size-8"
										aria-label={`Add a point to ${game.title}`}
										disabled={mine >= maxPerGame || remaining <= 0}
										onClick={() => adjust(game.id, 1)}
									>
										<PlusIcon />
									</Button>
								</div>
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
