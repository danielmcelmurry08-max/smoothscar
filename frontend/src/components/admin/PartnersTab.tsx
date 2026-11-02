import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";

import { getAdminApplications } from "../../api";
import { useTheme } from "../../theme";
import { ContactButtons, useAdminStyles } from "./shared";

export function PartnersTab({ passcode }: { passcode: string }) {
  const styles = useAdminStyles();
  const { colors } = useTheme();
  const { data = [], isLoading, isFetching, isError, refetch } = useQuery({ queryKey: ["admin-apps", passcode], queryFn: () => getAdminApplications(passcode) });

  if (isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.brandPrimary} />;
  return (
    <FlatList
      data={data}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => { refetch(); }} tintColor={colors.brandPrimary} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.count} testID="admin-count">{data.length} application{data.length === 1 ? "" : "s"}</Text>
          {isError ? <Text style={styles.error}>Couldn&apos;t load applications. Pull to retry.</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.body}>No applications yet.</Text>}
      renderItem={({ item }) => {
        const extra = [item.contact_name, item.role, item.location, item.practice_type, item.monthly_volume].filter(Boolean);
        return (
          <View style={styles.card} testID={`admin-application-${item.id}`}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{item.clinic_name}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</Text>
            </View>
            {item.credentials ? <Text style={styles.meta}>Credentials: {item.credentials}</Text> : null}
            {extra.length ? <Text style={styles.meta}>{extra.join(" · ")}</Text> : null}
            {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
            {item.email_status && item.email_status !== "sent" ? (
              <Text style={styles.error} testID={`admin-email-status-${item.id}`}>Notification email not delivered ({item.email_status.replace("failed:", "").replace(/_/g, " ")})</Text>
            ) : null}
            <ContactButtons email={item.email} phone={item.phone} testIDPrefix={`admin-${item.id}`} />
          </View>
        );
      }}
    />
  );
}
