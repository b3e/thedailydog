import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, source = "website" } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Get client IP and user agent for GDPR compliance
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if email already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json(
          { error: "This email is already subscribed to our newsletter" },
          { status: 409 }
        );
      } else {
        // Reactivate subscription
        await prisma.subscription.update({
          where: { email: email.toLowerCase() },
          data: {
            isActive: true,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            ipAddress: ip,
            userAgent,
            source,
          },
        });

        return NextResponse.json({
          message: "Welcome back! Your subscription has been reactivated.",
        });
      }
    }

    // Create new subscription
    await prisma.subscription.create({
      data: {
        email: email.toLowerCase(),
        isActive: true,
        ipAddress: ip,
        userAgent,
        source,
      },
    });

    return NextResponse.json({
      message: "Successfully subscribed to our newsletter!",
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsubscribe requests
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Email not found in our subscription list" },
        { status: 404 }
      );
    }

    if (!subscription.isActive) {
      return NextResponse.json(
        { error: "This email is already unsubscribed" },
        { status: 409 }
      );
    }

    // Deactivate subscription
    await prisma.subscription.update({
      where: { email: email.toLowerCase() },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Successfully unsubscribed from our newsletter.",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe request. Please try again." },
      { status: 500 }
    );
  }
}
