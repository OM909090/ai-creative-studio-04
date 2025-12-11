import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lock, Shield, User } from 'lucide-react';
import { securityService } from '@/lib/security';
import { PERMISSION_DEFINITIONS } from '@/types/security';

export function PermissionsManager() {
  const [userId] = useState('demo-user');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const handleLoadProfile = () => {
    const profile = securityService.getUserProfile(userId);
    if (!profile) {
      securityService.createUserProfile(userId, 'user');
    }
    setSelectedPermissions(profile?.permissions || []);
    setProfileLoaded(true);
  };

  const permissions = Object.values(PERMISSION_DEFINITIONS);
  const categories = Array.from(new Set(permissions.map(p => p.category)));

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'monitoring': return <AlertCircle className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Permissions Management
          </CardTitle>
          <CardDescription>View and manage user permissions and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!profileLoaded ? (
            <Button onClick={handleLoadProfile}>Load Security Profile</Button>
          ) : (
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="capitalize">
                    {cat.replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map(category => (
                <TabsContent key={category} value={category} className="space-y-3">
                  <div className="grid gap-3">
                    {permissions
                      .filter(p => p.category === category)
                      .map(permission => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getIconForCategory(category)}
                              <span className="font-medium">{permission.name}</span>
                              <Badge className={getRiskColor(permission.riskLevel)}>
                                {permission.riskLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                          </div>
                          <div>
                            {selectedPermissions.includes(permission.id) ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {profileLoaded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Permissions:</span>
              <span className="font-semibold">{selectedPermissions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical Permissions:</span>
              <span className="font-semibold">
                {permissions.filter(p => p.riskLevel === 'critical' && selectedPermissions.includes(p.id)).length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
