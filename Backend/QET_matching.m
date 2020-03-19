clear all;
close all;
clc;

%Input the key data points (degree of polynomial should be < data points)
QET_matrix = readmatrix('sample_input.txt'); %First row is time, Second row is excitement
x_keydata = QET_matrix(1,:); %The time points from the user input file
y_keydata = QET_matrix(2,:); %The corresponding excitement ratings
p_keydata = polyfit(x_keydata,y_keydata,3); %Get polynomial coefficients for the key data points
f_keydata = polyval(p_keydata,x_keydata); %Generate a fucntion from coefficients
figure;
plot(x_keydata,y_keydata,'o',x_keydata,f_keydata,'-'); %Not a desirable outcome -> use interpolation
title("Input of key data points and polynomial fit");
xlabel("Time [m]");
ylabel("Excitement rating [0,1]");

%Interpolation for the key data points
samples = max(x_keydata); %#samples to interpolate
x_interpolation = 1:samples;
for i = 1:samples
    y_interpolation(i) = interp1(x_keydata,y_keydata,i); %Linear interpolation between input points
end

%Get a formula for the graph
n = 7; %Degree of the polynomial
p_polynomial = polyfit(x_interpolation,y_interpolation,n); %Get polynomial coefficients for the interpolated data
f_polynomial = polyval(p_polynomial,x_interpolation); %Make a function from these coefficients

%Create discrete bars (the songs)
songlength = 2; %In minutes
for i = 1:songlength:length(f_polynomial)
    track_histogram(i) = f_polynomial(i); %Generate the discrete tracks
end
figure;
hold on;
plot(x_interpolation,y_interpolation,'o',x_interpolation,f_polynomial,'-'); %Plot graphs
alpha(bar(track_histogram,songlength),0.1); %Plot bars
ylim([0.6 1.05]);
title("Interpolation result and polynomial fit");
xlabel("Time [m]");
ylabel("Excitement rating [0,1]");
legend("Interpolated values", "Polynomial curve", "Tracks on the set");

%Output the formula coefficients
fprintf("Fitted formula coefficients (a1*x^n + a2*x^(n-1) + ...): \n");
for i = 1:n+1
    fprintf("%d \n",p_polynomial(i)); %Prints the coefficients
end

%Output the tracks' excitement rating to a text-file
fileID = fopen('sample_output.txt','w');
fprintf(fileID,"%1.3f\r\n",track_histogram);
fclose(fileID);


