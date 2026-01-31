import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KnowYourRightsPage() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Know Your Rights</CardTitle>
        <CardDescription>
          This feature is under development.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          An overview of important legal rights for every citizen will be available here soon.
        </p>
      </CardContent>
    </Card>
  );
}
