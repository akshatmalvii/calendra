import { getEvent } from "@/server/actions/events";
import { AlertTriangle } from "lucide-react";
import {
  addYears,
  eachMinuteOfInterval,
  endOfDay,
  roundToNearestMinutes,
} from "date-fns";
import { getValidTimesFromSchedule } from "@/server/actions/schedule";
import NoTimeSlots from "@/components/NoTimeSlots";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clerkClient } from "@clerk/nextjs/server";
import MeetingForm from "@/components/forms/MeetingForm";



export default async function BookingPage({
  params,
}: {
  params: { clerkUserId: string; eventId: string };
}) {
  // Debug first to see what's actually coming in
  console.log("Received params:", JSON.stringify(params, null, 2));

  // Now safely destructure with defaults
  const { clerkUserId = "", eventId = "" } = params;

  // Validate parameters
  if (!clerkUserId || !eventId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md max-w-md mx-auto mt-6">
        Invalid URL - missing user or event ID
      </div>
    );
  }

  // Fetch event
  const event = await getEvent(clerkUserId, eventId);

  if (!event) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md max-w-md mx-auto mt-6">
        Event not found
      </div>
    );
  }

  // Get the full user object from Clerk
  const client = await clerkClient();
  const calendarUser = await client.users.getUser(clerkUserId);

  // Define a date range from now (rounded up to the nearest 15 minutes) to 1 year later
  const startDate = roundToNearestMinutes(new Date(), {
    nearestTo: 15,
    roundingMethod: "ceil",
  });

  const endDate = endOfDay(addYears(startDate, 1)); // Set range to 1 year ahead

  // Generate valid available time slots for the event using the custom scheduler logic
  const validTimes = await getValidTimesFromSchedule(
    eachMinuteOfInterval({ start: startDate, end: endDate }, { step: 15 }),
    event
  );

  // If no valid time slots are available, show a message and an option to pick another event
  if (validTimes.length === 0) {
    return <NoTimeSlots event={event} calendarUser={calendarUser} />;
  }

  // Render the booking form with the list of valid available times
  return (
    <Card className="max-w-4xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.fullName}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <MeetingForm
          validTimes={validTimes}
          eventId={event.id}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  );
}
