import { AnalyzePackageButton, BreadcrumbNav } from "@malloy-publisher/sdk";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

export default function Header() {
    const { projectName, packageName } = useParams();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                backgroundColor: "background.paper",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            component="img"
                            src="/logo.svg"
                            alt="Malloy"
                            sx={{
                                width: 28,
                                height: 28,
                            }}
                        />
                        <Typography
                            variant="h5"
                            sx={{
                                color: "text.primary",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                            }}
                        >
                            Malloy Publisher
                        </Typography>
                    </Box>
                    <BreadcrumbNav />
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    {!projectName || !packageName ? (
                        <>
                            <Button href="https://docs.malloydata.dev/documentation/">
                                Malloy Docs
                            </Button>
                            <Button href="https://github.com/malloydata/publisher/blob/main/README.md">
                                Publisher Docs
                            </Button>
                            <Button href="/api-doc.html">Publisher API</Button>
                        </>
                    ) : (
                        <>
                            <AnalyzePackageButton
                                projectName={projectName}
                                packageName={packageName}
                            />
                        </>
                    )}
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
