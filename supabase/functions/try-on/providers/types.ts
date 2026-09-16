export type TryOnResult = {
  status: "succeeded" | "failed";
  imageUrl?: string;
  providerJobId?: string;
  errorCode?: string;
};

export interface TryOnProvider {
  readonly name: string;
  readonly model: string;
  readonly estimatedCostUsd: number;
  run(input: { personImageUrl: string; garmentImageUrl: string }): Promise<TryOnResult>;
}
