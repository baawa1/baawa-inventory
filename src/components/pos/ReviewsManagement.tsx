"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconSearch,
  IconStar,
  IconStarFilled,
  IconEye,
  IconCheck,
  IconX,
  IconMessageCircle,
  IconUser,
  IconCalendar,
  IconThumbUp,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Review {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsManagementProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchReviews(status: string, search: string): Promise<Review[]> {
  const params = new URLSearchParams({
    status,
    search,
  });

  const response = await fetch(`/api/pos/reviews?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
}

async function updateReviewStatus(
  reviewId: number,
  status: "approved" | "rejected"
): Promise<void> {
  const response = await fetch(`/api/pos/reviews/${reviewId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update review status");
  }
}

export function ReviewsManagement({ user }: ReviewsManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const queryClient = useQueryClient();

  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reviews", selectedStatus, searchTerm],
    queryFn: () => fetchReviews(selectedStatus, searchTerm),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      reviewId,
      status,
    }: {
      reviewId: number;
      status: "approved" | "rejected";
    }) => updateReviewStatus(reviewId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update review status");
    },
  });

  if (error) {
    toast.error("Failed to load reviews");
  }

  const statusOptions = [
    { value: "all", label: "All Reviews" },
    { value: "pending", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <IconStarFilled className="w-4 h-4 text-yellow-400" />
        ) : (
          <IconStar className="w-4 h-4 text-gray-300" />
        )}
      </span>
    ));
  };

  const handleStatusUpdate = (
    reviewId: number,
    status: "approved" | "rejected"
  ) => {
    updateStatusMutation.mutate({ reviewId, status });
  };

  // Calculate summary stats
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Reviews</h1>
          <p className="text-muted-foreground">
            Manage and moderate customer product reviews
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Need attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <div className="text-xs text-muted-foreground">Live reviews</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <IconStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex">
              {getRatingStars(Math.round(averageRating))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews, products, or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.productName}</div>
                        {review.isVerifiedPurchase && (
                          <Badge variant="outline" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(review.rating)}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({review.rating}/5)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate">{review.comment}</p>
                        {review.helpfulCount > 0 && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <IconThumbUp className="w-3 h-3 mr-1" />
                            {review.helpfulCount} helpful
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <IconCalendar className="w-3 h-3 mr-1" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReview(review)}
                            >
                              <IconEye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Details</DialogTitle>
                              <DialogDescription>
                                Full review information and moderation actions
                              </DialogDescription>
                            </DialogHeader>

                            {selectedReview && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      Product
                                    </label>
                                    <p className="text-sm">
                                      {selectedReview.productName}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Customer
                                    </label>
                                    <p className="text-sm">
                                      {selectedReview.customerName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedReview.customerEmail}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    Rating
                                  </label>
                                  <div className="flex items-center space-x-1 mt-1">
                                    {getRatingStars(selectedReview.rating)}
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({selectedReview.rating}/5)
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    Comment
                                  </label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm">
                                      {selectedReview.comment}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      Status
                                    </label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedReview.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Verified
                                    </label>
                                    <p className="text-sm">
                                      {selectedReview.isVerifiedPurchase
                                        ? "Yes"
                                        : "No"}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Helpful
                                    </label>
                                    <p className="text-sm">
                                      {selectedReview.helpfulCount} votes
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <DialogFooter>
                              {selectedReview?.status === "pending" && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      if (selectedReview) {
                                        handleStatusUpdate(
                                          selectedReview.id,
                                          "rejected"
                                        );
                                      }
                                    }}
                                  >
                                    <IconX className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (selectedReview) {
                                        handleStatusUpdate(
                                          selectedReview.id,
                                          "approved"
                                        );
                                      }
                                    }}
                                  >
                                    <IconCheck className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {review.status === "pending" &&
                          user.role !== "STAFF" && (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(review.id, "approved")
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                <IconCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(review.id, "rejected")
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                <IconX className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reviews.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No reviews found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
